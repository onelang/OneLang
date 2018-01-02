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
    $self->{offset} = 5;
    $self->{str_test} = "test" . "test2";
    $self->{str_constr} = "constr";
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