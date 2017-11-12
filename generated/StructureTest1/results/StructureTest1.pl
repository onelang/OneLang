use strict;
use warnings;

package List;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    
    return $self;
}



package Item;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $str_constr ) = @_;
    $self->{str_constr} = $str_constr;
    return $self;
}





package Container;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    
    return $self;
}




sub method0 {
    my ( $self ) = @_;
    
}

sub method1 {
    my ( $self, $str ) = @_;
    return $str;
}

package Program;
my $c = new TestClass();
$c->testMethod();