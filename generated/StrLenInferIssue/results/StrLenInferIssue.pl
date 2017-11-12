use strict;
use warnings;

package StrLenInferIssue;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    
    return $self;
}

sub test {
    my ( $self, $str ) = @_;
    return length($str);
}

package Program;
my $c = new TestClass();
$c->testMethod();